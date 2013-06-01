Ext.define('PortfolioTreesWithCards', {
    extend: 'Rally.ui.tree.PortfolioTree',
    getTreeItemConfigForRecordFn: function(){
        return function(){
            xtype: 'rallyportfolioitemtreeitem'
        };
    },
    makeTreeItemDraggable: function(treeItem){
        var tree = this;

        if(treeItem.getCanDrag()){
            var me = this;
            var dragSource = Ext.create('Ext.dd.DragSource', treeItem.getEl(), {
                treeItem: treeItem,
                getDragData: function() {
                    var ret = {
                        card: Ext.create('Rally.ui.cardboard.Card', {
                            record: treeItem.getRecord()    
                        }),
                        column: {
                            findCardInfo: function() {
                                return { 
                                    index: -1
                                };
                            }
                        }
                    };
                    return ret;
                },
                ddGroup: 'cardboard',
                isTarget: false,
                proxy: Ext.create('Ext.dd.StatusProxy', {
                    animRepair: true,
                    shadow: false,
                    dropNotAllowed: 'rallytree-proxy'
                }),
                beforeDragDrop: function(){
                    me.fireEvent('drag', treeItem);
                    return true;
                },
                afterDragDrop: function(){
                    me.fireEvent('drop', treeItem);
                }
            });

            dragSource.setHandleElId(treeItem.getEl().down('.drag').id);
        }

        if(treeItem.getCanDropOnMe()){
            var dropTarget = Ext.create('Rally.ui.tree.TreeItemDropTarget', treeItem.down('#treeItemContent').getEl(), {
                tree: tree,
                treeItem: treeItem
            });

            if(treeItem.dropTarget){
                treeItem.dropTarget.unreg();
            }

            treeItem.dropTarget = dropTarget;

            var dropTargetGroups = this.getDragThisGroupOnMeFn().call(this.getScope(), treeItem.getRecord());
            if(!Ext.isArray(dropTargetGroups)){
                dropTargetGroups = [dropTargetGroups];
            }
            Ext.each(dropTargetGroups, function(dropTargetGroup){
                dropTarget.addToGroup(dropTargetGroup);
            });
        }

    },
    treeItemConfigForRecordFn: function(record){
        var card = Ext.create('Rally.ui.cardboard.Card', {
            record: record
        });
        return {
            xtype: 'treeswithcardsitem',
            canDrag: true,
            expanded: true,
            record: record,
            card: card 
        };
    }
});

Ext.define('PlanIterationsAndReleases.StoryTree', {
    extend: 'Ext.Container',
    xtype: 'storytree',
    resize: true,

    initComponent: function () {
        this.callParent(arguments);
        this.add({
            xtype: 'component',
            autoEl: 'h1',
            html: 'Unscheduled Story Hierarchy'
        });
        this.add({
            xtype: 'component',
            cls: 'grayLabel',
            html: 'Drill down to see unscheduled leaf user stories. Drag and drop into an iteration on the right.'
        });
        this.buildTree();
    },

    buildTree: function () {

        Rally.data.util.PortfolioItemHelper.loadTypeOrDefault({
            typeRef: 'https://rally1.rallydev.com/slm/webservice/v2.0/typedefinition/4628828148',
            success: function (typeRecord) {

                var tree = Ext.create('PortfolioTreesWithCards', {
                    enableDragAndDrop: true,            
                    dragDropGroupFn: function(record){
                        return 'cardboard';
                    },dragThisGroupOnMeFn: function(record){
                        return 'cardboard';
                    },
                    topLevelModel: typeRecord.get('TypePath'),
                    treeItemConfigForRecordFn: function (record) {
                        var canDrag = record.get('_type') === 'hierarchicalrequirement' && record.get('Children').length === 0;

                        var config = {
                            canDrag: canDrag
                        };
                        if (record.get('_type') === 'hierarchicalrequirement') {
                            config.xtype = 'rallystorytreeitem';
                        } else {
                            config.xtype = 'rallyportfolioitemtreeitem';
                        }
                        return config;
                    }
                });

                this.add(tree);

            },
            scope: this
        });


    }
});