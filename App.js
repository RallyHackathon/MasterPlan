Ext.define('PlanPlanPalatable', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: 'hbox',
    items: [
        {
            itemId: 'accContainer',
            layout: 'accordion',
            defaults: {
                bodyPadding: 10
            },
            height: '100%',
            items: [
                {
                    title: 'Story Hierarchy',
                    itemId: 'storyHierarchyPanel',
                    resizable: true,
                    autoScroll: true,
                    height: '100%'
                },
                {
                    title: 'Orphaned Stories',
                    itemId: 'orphanStories',
                    resizable: true,
                    autoScroll: true,
//                    height: 600
                },
                {
                    title: 'Defects',
                    itemId: 'defects',
                    resizable: true,
                    autoScroll: true,
//                    height: 600
                }
            ],
            flex: 1
            
        },              
        {
            xtype: 'container',
            cls: 'rightSide',
            itemId: 'rightSide',
            flex: 1,
            height: '100%',
            autoScroll: true
        }
    ],

    launch: function() {
        this.buildStoryTree();        
        this.buildIterationsAndReleases();
    },

    buildStoryTree: function(){        
        var storyTree = Ext.create('PlanIterationsAndReleases.StoryTree');
        
		this.down('#storyHierarchyPanel').add(storyTree);
    },
    
    buildIterationsAndReleases: function(){
        var iterationsAndReleases = Ext.create('PlanIterationsAndReleases.IterationsAndReleases');
        this.down('#rightSide').add(iterationsAndReleases);
    }

});
